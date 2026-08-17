async function applyOrRemoveCode(promoCode, utils, codeAction) {
  const oa2 = (document.cookie.match(/oa2=([^&;]+)?/) || [])[1];
  const csrf = $('meta[name="csrf-token"]').attr('content') || '';

  const requestPayload = { source: 'ps_cart' };
  if (codeAction === 'apply') {
    requestPayload.promotionName = promoCode;
    requestPayload.order_id = '';
  } else {
    requestPayload.promotionName = '';
    requestPayload.promotionsToIgnore = '';
    requestPayload.isCouponRemoved = true;
  }

  try {
    const response = await $.ajax({
      url: '/cart/updatecart',
      type: 'POST',
      headers: {
        accept: 'application/json',
        Authorization: `OAuth ${oa2}`,
        'content-type': 'application/json',
        Oa2: oa2,
        'X-Csrf-Token': csrf,
      },
      data: JSON.stringify(requestPayload),
    });

    utils.logger.debug(`Finishing ${codeAction} coupon action`);
    return response;
  } catch (error) {
    utils.logger.debug(`Error on ${codeAction} coupon action: ${error}`);
    return null;
  }
}

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse.runningTotal;
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
  } else {
    await applyOrRemoveCode(promoCode, utils, 'remove');
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
