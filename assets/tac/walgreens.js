async function applyOrRemoveCode(promoCode, utils, codeAction) {
  const dtpc = (document.cookie.match(/dtPC=([^&;]+)?/) || [])[1];
  const csrf = $('meta[name="_csrf"]').attr('content') || '';

  const action = codeAction === 'apply' ? 'add' : 'delete';

  try {
    const response = await $.ajax({
      url: '/cart/v1/promos',
      type: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json; charset=UTF-8',
        'X-Dtpc': dtpc,
        'X-Xsrf-Token': csrf,
      },
      data: JSON.stringify({
        action,
        couponCode: promoCode,
      }),
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
    const rawPrice = applyCodeResponse?.orderPriceInfo?.finalOrderPrice;
    if (rawPrice) {
      newPrice = rawPrice / 100;
    } else {
      newPrice = originalPrice;
    }
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
