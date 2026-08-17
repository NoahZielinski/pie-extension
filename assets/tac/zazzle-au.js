async function applyOrRemoveCode(couponLocation, promoCode, utils, action) {
  const csrfToken =
    ($('script')
      .text()
      .match(/"csrf":"(.+?)"/) || [])[1] || '';
  const requestData = {
    client: 'js',
    csrf: csrfToken,
    promoCode,
  };
  let requestUrl;

  if (action === 'apply') {
    requestData.returnCheckoutData = true;
    requestUrl = '/svc/z3/promotion/applyPromo';
    if (couponLocation === 'cart') {
      requestData.returnCart = true;
    } else {
      requestData.returnCart = false;
    }
  } else {
    requestData.returnCheckoutData = false;
    requestUrl = '/svc/z3/promotion/removePromo';
  }

  try {
    const response = await $.ajax({
      url: requestUrl,
      type: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Csrf-Token': csrfToken,
      },
      data: JSON.stringify(requestData),
    });

    utils.logger.debug(`Finishing ${action} coupon action`);
    return response;
  } catch (error) {
    utils.logger.debug(`Error on ${action} coupon: ${error}`);
    return null;
  }
}

function updatePrice(couponLocation, applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    if (couponLocation === 'cart') {
      newPrice = utils.parsePrice(applyCodeResponse.data.cart.orderTotal) || originalPrice;
    } else {
      newPrice = utils.parsePrice(applyCodeResponse.data.orderTotal.total) || originalPrice;
    }
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(`$${newPrice.toFixed(2)}`);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const couponLocation = window.location.href.match(/\/cart/) ? 'cart' : 'checkout';
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyOrRemoveCode(couponLocation, promoCode, utils, 'apply');
  finalPrice = updatePrice(couponLocation, applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(500);
  } else if (applyCodeResponse.data.cart || applyCodeResponse.data.orderTotal) {
    // remove the code we just applied to be ready for the next code application
    // we know the code was successful if the response contains the cart object
    await applyOrRemoveCode(couponLocation, promoCode, utils, 'remove');
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
