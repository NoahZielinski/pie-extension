async function applyCode(couponCode, utils) {
  try {
    const response = await $.ajax({
      url: 'https://www.sephora.com/api/shopping-cart/basket/promotions',
      type: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        couponCode,
      }),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(couponCode, utils) {
  try {
    await $.ajax({
      url: 'https://www.sephora.com/api/shopping-cart/baskets/current/promotions',
      type: 'DELETE',
      headers: {
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        couponCode,
        orderId: 'current',
      }),
    });

    utils.logger.debug('Finishing removing coupon');
  } catch (error) {
    utils.logger.debug(`Error removing coupon: ${error}`);
  }
}

async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;
  try {
    newPrice = applyCodeResponse.subtotal;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(`$${newPrice}`);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(200);
  } else {
    await removeCode(promoCode, utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

window.tacSubmit = tacSubmit;
