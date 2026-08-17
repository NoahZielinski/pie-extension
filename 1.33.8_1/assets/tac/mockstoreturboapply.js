async function applyCode(promoCode, utils) {
  try {
    const response = await $.ajax({
      url: '/apply-tac',
      type: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      data: JSON.stringify({ code: promoCode }),
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
    const { discount } = applyCodeResponse;
    newPrice = originalPrice * discount;
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

  if (isApplyBest) {
    window.location.reload();
    await utils.wait(200);
  }

  return Number(utils.parsePrice(finalPrice));
}

window.tacSubmit = tacSubmit;
