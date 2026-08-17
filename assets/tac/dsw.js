// Define constants for hard-coded strings
const LOCALE = 'en_US';
const PUSH_SITE = 'DSW';

async function applyCode(promoCode, utils) {
  try {
    const response = await $.ajax({
      url: `/api/v1/coupons/claim?locale=${LOCALE}&pushSite=${PUSH_SITE}`,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/plain, */*',
        'X-Dbi-App-Id': 'ecomm-web',
        'X-Dbi-App-Version': '2.0.0',
      },
      data: JSON.stringify({
        cart: 'shoppingcart',
        couponClaimCode: promoCode,
      }),
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
    const cartDetailsResponse = await $.ajax({
      url: `/api/v1/cart/details?locale=${LOCALE}&pushSite=${PUSH_SITE}`,
      method: 'GET',
      headers: {
        accept: 'application/json, text/plain, */*',
        'X-Dbi-App-Id': 'ecomm-web',
        'X-Dbi-App-Version': '2.0.0',
      },
    });
    newPrice = cartDetailsResponse.orderSummary.orderTotal;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

// Main function to submit the coupon
async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  await applyCode(promoCode, utils);
  finalPrice = await updatePrice(cartPriceSelector, originalPrice, utils);

  // If the best coupon should be applied, reload the page and wait for 2 seconds
  if (isApplyBest === true) {
    window.location = window.location.href;
    await utils.wait(200);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Expose the function to the global scope
window.tacSubmit = tacSubmit;
