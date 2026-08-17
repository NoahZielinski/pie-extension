// apply codes using request
async function applyCode(promoCode, utils) {
  const BRAND_TYPE_REGEX = /brandType":"(\w+)"/;
  const brandType = ($('script:contains(SHOPPING_BAG_STATE)').text().match(BRAND_TYPE_REGEX) || [])[1];

  try {
    const response = await $.ajax({
      url: '/shopping-bag-xapi/apply-bag-promo',
      method: 'POST',
      headers: {
        channel: 'WEB',
        brand: 'AT',
        brandtype: brandType || 'specialty',
        market: 'CA',
        locale: 'en_CA',
        'content-type': 'application/json;charset=UTF-8',
      },
      data: JSON.stringify({
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

// update price based on the response
async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse.summaryOfCharges.myTotal;
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

  return Number(utils.parsePrice(finalPrice));
}

window.tacSubmit = tacSubmit;
