async function applyOrRemoveCode(promoCode, utils, action) {
  const xsrfToken = (document.cookie.match(/XSRF-TOKEN=([^;]*)/) || [])[1];
  let requestData = {};
  let requestUrl;

  if (action === 'apply') {
    requestUrl = '/checkout/promo/setPromoCode';
    requestData = { code: promoCode };
  } else {
    requestUrl = '/cart/promo/removePromoCode';
  }

  try {
    const response = await $.ajax({
      url: requestUrl,
      type: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-type': 'application/json',
        'X-Xsrf-Token': xsrfToken,
      },
      data: JSON.stringify(requestData),
    });

    utils.logger.debug(`Finishing ${action} coupon action`);
    return response;
  } catch (error) {
    utils.logger.debug(`Error on ${action} coupon action: ${error}`);
    return null;
  }
}

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse.totalPrice.formattedValue;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyOrRemoveCode(promoCode, utils, 'apply');
  finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  // remove code if it was successfully applied so we are prepared to test the next code
  // successful responses contain a cart object, failed responses only contain an errors object
  if (applyCodeResponse.promoResponse) {
    await applyOrRemoveCode(promoCode, utils, 'remove');
  }

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
