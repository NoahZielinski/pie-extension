async function applyCode(promoCode, utils) {
  const baseUrl =
    ($('script')
      .text()
      .match(/"addCoupon":"([^"]+)?"/) || [])[1] || 'https://www.madewell.com/on/demandware.store/Sites-madewellUS-Site/default/Cart-AddCouponJson';

  try {
    const response = await $.ajax({
      url: `${baseUrl}?couponCode=${promoCode}&format=ajax`,
      type: 'GET',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function getCart(utils) {
  try {
    const response = await $.ajax({
      url: window.location.href,
      type: 'GET',
    });

    utils.logger.debug('Finished fetching cart');
    return response;
  } catch (error) {
    utils.logger.debug(`Error fetching cart: ${error}`);
    return null;
  }
}

function updatePrice(cartResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const priceString = $(cartResponse).find(cartPriceSelector).text() || originalPrice;
    newPrice = Number(utils.parsePrice(priceString));
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

  await applyCode(promoCode, utils);
  const cartResponse = await getCart(utils);
  finalPrice = updatePrice(cartResponse, cartPriceSelector, originalPrice, utils);
  if (isApplyBest) {
    window.location.reload();
    await utils.wait(500);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
