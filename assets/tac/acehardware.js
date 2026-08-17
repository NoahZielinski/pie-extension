async function applyOrRemoveCode(promoCode, utils, action) {
  const requestPayload = {
    couponCode: promoCode,
  };

  if (action === 'remove') {
    requestPayload.operationCode = 'D';
  }

  try {
    const response = await $.ajax({
      url: 'https://www.acehardware.com/coupons/process',
      type: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: JSON.stringify(requestPayload),
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
    newPrice = applyCodeResponse.total;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyOrRemoveCode(promoCode, utils, 'apply');
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);
  await applyOrRemoveCode(promoCode, utils, 'remove');

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

// Assign the tacSubmit function to the window object
window.tacSubmit = tacSubmit;
