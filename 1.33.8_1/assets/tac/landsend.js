async function applyOrRemoveCode(promoCode, utils, action) {
  const csrfToken = (document.cookie.match(/X-CSRF-TOKEN=([^;]*)/) || [])[1];
  const dtpc = (document.cookie.match(/dtPC=([^;]*)/) || [])[1];
  let requestData;
  let requestUrl;

  if (action === 'apply') {
    requestUrl = '/co/checkout/applyPromotion';
    requestData = {
      functionName: 'applyPromotion',
      promoCode,
    };
  } else {
    requestUrl = '/co/checkout/removePromotion';
    requestData = {
      functionName: 'removePromotion',
    };
  }

  try {
    const response = await $.ajax({
      url: requestUrl,
      type: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-type': 'application/x-www-form-urlencoded',
        'X-Csrf-Token': csrfToken,
        'X-Dtpc': dtpc,
      },
      data: requestData,
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse.billToLite.amountDue / 100;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyOrRemoveCode(promoCode, utils, 'apply');
  finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(500);
  } else {
    await applyOrRemoveCode(promoCode, utils, 'remove');
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
