async function applyCode(promoCode, utils) {
  const bagId = (document.cookie.match(/bloomingdales_bagguid=([^&;]+)?/) || [])[1];

  try {
    const response = await $.ajax({
      url: `/my-bag/${bagId}/promo?promoCode=${promoCode}`,
      type: 'PUT',
      headers: {
        accept: 'application/json',
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

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const priceSection = applyCodeResponse.bag.sections.summary.price;
    const priceObj = priceSection.filter((obj) => obj.label === 'Pre-Tax Order Total');
    newPrice = priceObj[0].values[0].formattedValue;
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
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
