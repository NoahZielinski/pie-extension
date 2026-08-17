async function applyCodeCart(promoCode, utils) {
  const csrfToken = $('input[name="csrf_token"]').attr('value') || '';

  try {
    const response = await $.ajax({
      url: 'https://www.saksfifthavenue.com/cart-coupon-add',
      type: 'GET',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
      },
      data: {
        couponCode: promoCode,
        csrf_token: csrfToken,
      },
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
    newPrice = applyCodeResponse.totals.grandTotal;
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

  const applyCodeResponse = await applyCodeCart(promoCode, utils);
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(600);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Expose the tacSubmit function to the global scope
window.tacSubmit = tacSubmit;
