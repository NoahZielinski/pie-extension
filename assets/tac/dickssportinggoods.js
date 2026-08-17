async function applyOrRemoveCode(promoCode, utils, codeAction) {
  const checkoutId = (document.cookie.match(/X-DCSG-CHECKOUT=([^&;]+)?/) || [])[1];
  let requestUrl = `/api/v1/checkouts/${checkoutId}/promotion/cart/promotions`;
  const requestMethod = codeAction === 'apply' ? 'PUT' : 'DELETE';

  if (codeAction === 'remove') {
    requestUrl += `/${promoCode}`;
  }

  try {
    const response = await $.ajax({
      url: requestUrl,
      type: requestMethod,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: promoCode,
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
    const orderObj = applyCodeResponse.order_summary;
    const totalObjKey = Object.keys(orderObj || {}).find((key) => orderObj[key]?.type === 'ESTIMATED_TOTAL');
    newPrice = orderObj[totalObjKey]?.display_amount;
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
  } else if (applyCodeResponse && !applyCodeResponse.error) {
    await applyOrRemoveCode(promoCode, utils, 'remove');
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
