async function applyCode(promoCode, utils) {
  try {
    const response = await $.ajax({
      url: `https://www.buyagift.co.uk/Basket/ApplyDiscount?code=${promoCode}`,
      type: 'GET', // Use constant for method type
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse.TotalBasketPrice;
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
    await utils.wait(200);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
