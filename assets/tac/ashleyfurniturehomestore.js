async function applyCode(promoCode, utils) {
  const csrfToken = $('#cart-items-form [name="csrf_token"]').val() || '';

  try {
    const response = await $.ajax({
      url: '/check-out/',
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: {
        dwfrm_cart_updateCart: 'dwfrm_cart_updateCart',
        dwfrm_cart_couponCode: promoCode,
        dwfrm_cart_addCoupon: 'dwfrm_cart_addCoupon',
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

async function updatePrice(cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const response = await $.ajax({
      url: window.location.href,
      type: 'GET',
    });

    newPrice = $(response).find(cartPriceSelector).text();
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

// Async function to submit a form with a coupon code and return the price
async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  await applyCode(promoCode, utils);
  finalPrice = await updatePrice(cartPriceSelector, originalPrice, utils);

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

// Assign tacSubmit function to window object
window.tacSubmit = tacSubmit;
