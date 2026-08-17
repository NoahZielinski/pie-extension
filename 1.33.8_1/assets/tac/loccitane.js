async function applyCode(promoCode, utils) {
  const requestUrl =
    ($('script')
      .text()
      .match(/"handleCoupon":"([^\\"]+)?"/) || [])[1] || '/on/demandware.store/Sites-OCC_US-Site/en_US/Cart-HandleCoupon';
  const token = $('.o-cart-coupon-code:visible input[name="csrf_token"]').val() || '';

  try {
    const response = await $.ajax({
      url: `${requestUrl}?format=ajax`,
      type: 'POST',
      headers: {
        accept: 'text/html, */*; q=0.01',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      data: {
        action: 'ADD_COUPON',
        couponCode: promoCode,
        csrf_token: token,
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(promoCode, utils) {
  const requestUrl =
    ($('script')
      .text()
      .match(/"handleCoupon":"([^\\"]+)?"/) || [])[1] || '/on/demandware.store/Sites-OCC_US-Site/en_US/Cart-HandleCoupon';
  const token = $('.o-cart-coupon-code:visible input[name="csrf_token"]').val() || '';

  try {
    const response = await $.ajax({
      url: `${requestUrl}?format=ajax`,
      type: 'POST',
      headers: {
        accept: 'text/html, */*; q=0.01',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      data: {
        action: 'REMOVE_COUPON',
        couponCode: promoCode,
        csrf_token: token,
      },
    });

    utils.logger.debug('Finishing removing coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error removing coupon: ${error}`);
    return null;
  }
}

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = $(applyCodeResponse).find(cartPriceSelector).text() || originalPrice;
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

  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(500);
  } else {
    await removeCode(promoCode, utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
