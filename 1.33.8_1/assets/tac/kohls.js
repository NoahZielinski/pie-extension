async function applyCode(promoCode, utils) {
  try {
    const response = await $.ajax({
      url: '/cnc/applyCoupons',
      type: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      data: JSON.stringify([
        {
          couponType: 'promo',
          promoCode,
        },
      ]),
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
    newPrice = applyCodeResponse.cartJsonData.orderSummary.total;
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
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest === true) {
    window.location = window.location.href;
    await utils.wait(200);
  }

  return finalPrice;
}

// Assign the tacSubmit function to the window object
window.tacSubmit = tacSubmit;
