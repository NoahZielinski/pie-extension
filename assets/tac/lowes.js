async function applyCode(promoCode, utils) {
  const cartId = ($('script')
    .text()
    .match(/"cartId":"([^"]+)?"/) || [])[1];
  try {
    const response = await $.ajax({
      url: `/purchase/api/cart/${cartId}/promocode/${promoCode}`,
      type: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(promoId, utils) {
  const cartId = ($('script')
    .text()
    .match(/"cartId":"([^"]+)?"/) || [])[1];
  try {
    const response = await $.ajax({
      url: `/purchase/api/cart/${cartId}/promocode/${promoId}`,
      type: 'DELETE',
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
      },
    });

    utils.logger.debug('Finishing removing coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error removing coupon: ${error}`);
    return null;
  }
}

async function getCart(utils) {
  const cartId = ($('script')
    .text()
    .match(/"cartId":"([^"]+)?"/) || [])[1];
  try {
    const response = await $.ajax({
      url: `/purchase/api/checkout/${cartId}/reviewcheckout?cartType=SHOPPING`,
      type: 'GET',
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'X-Web-App': true,
      },
    });

    utils.logger.debug('Finished getting cart info');
    return response;
  } catch (error) {
    utils.logger.debug(`Error getting cart info: ${error}`);
    return null;
  }
}

function updatePrice(priceResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = priceResponse.cart.cartSummary.grandTotal || originalPrice;
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
  let appliedPromoData;

  const applyCodeResponse = await applyCode(promoCode, utils);
  try {
    const { promotions } = applyCodeResponse.data;
    appliedPromoData = promotions.find((promo) => promo['promoCode'].toLowerCase() === promoCode.toLowerCase());
  } catch (error) {
    utils.logger.debug(`Error getting applied promo data: ${error}`);
  }

  if (isApplyBest) {
    window.location.reload();
    await utils.wait(500);
  } else if (appliedPromoData) {
    const priceResponse = await getCart(utils);
    finalPrice = updatePrice(priceResponse, cartPriceSelector, originalPrice, utils);
    const promoId = appliedPromoData.promotionId;
    await removeCode(promoId, utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
