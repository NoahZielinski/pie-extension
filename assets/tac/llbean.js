async function applyOrRemoveCode(promoCode, utils, action, removeCodeId) {
  let requestUrl = '/api/udal/carts/promotions';
  if (action === 'remove') {
    requestUrl += `/${removeCodeId}`;
  }

  try {
    const response = await $.ajax({
      url: requestUrl,
      type: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
      },
      data: JSON.stringify({ code: promoCode }),
    });

    utils.logger.debug(`Finishing ${action} coupon action`);
    return response;
  } catch (error) {
    utils.logger.debug(`Error on ${action} coupon action: ${error}`);
    return null;
  }
}

async function fetchCodeId(applyCodeResponse, promoCode) {
  let codeId = '';

  try {
    const { promoCodes } = applyCodeResponse.properties.orderPromoInfoBean;
    const promoKey = Object.keys(promoCodes || {}).find((key) => promoCodes[key]?.promotionCode.replace(/\s/g, '') === promoCode.replace(/\s/g, ''));
    codeId = promoCodes[promoKey]?.id;
  } catch (e) {
    // failed to get promo code ID
  }

  return codeId;
}

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse.properties.orderFinancial.estimatedOrderTotal;
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

  const applyCodeResponse = await applyOrRemoveCode(promoCode, utils, 'apply');
  finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(500);
  } else if (applyCodeResponse?.properties) {
    const removeCodeId = await fetchCodeId(applyCodeResponse, promoCode);
    await applyOrRemoveCode(promoCode, utils, 'remove', removeCodeId);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
