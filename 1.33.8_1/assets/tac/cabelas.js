async function applyCode(promoCode, storeId, utils) {
  try {
    const response = await $.ajax({
      url: `/api/v2/${storeId}/prod/cart/promo/apply`,
      type: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        orderItemId: '',
        flexId: '',
        lName: '',
        orderId: '.',
        promoCode,
      }),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(promoCode, storeId, utils) {
  try {
    const response = await $.ajax({
      url: `/api/v2/${storeId}/prod/cart/promo/delete`,
      type: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        orderItemId: '',
        orderId: '.',
        promoCode,
      }),
    });

    utils.logger.debug('Finishing removing coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error removing coupon: ${error}`);
    return null;
  }
}

async function getCart(storeId, utils) {
  try {
    const response = await $.ajax({
      url: `/api/v2/${storeId}/prod/cart/get/cart`,
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
    const discountString = cartResponse.totalPromoSavings.replace(/-/, '') || '0';
    const discount = Number(utils.parsePrice(discountString));
    newPrice = (originalPrice - discount).toFixed(2);
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
  const pageUrl = window.location.href;
  const storeId = (pageUrl.match(/storeId=([\d]+)?/) || [])[1];
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  await applyCode(promoCode, storeId, utils);
  const cartResponse = await getCart(storeId, utils);
  finalPrice = updatePrice(cartResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(500);
  } else if (finalPrice < originalPrice) {
    await removeCode(promoCode, storeId, utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
