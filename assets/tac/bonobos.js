async function applyOrRemoveCode(promoCode, utils, action) {
  const authToken = (document.body.innerHTML.match(/"clientAuthToken":"([a-zA-Z0-9]*)"/) || [])[1];
  let cartId = '';
  let cartToken = '';
  let requestData = {};
  let requestMethod;

  if (action === 'apply') {
    requestMethod = 'PUT';
    requestData = { promotion: promoCode };
  } else {
    requestMethod = 'DELETE';
  }

  try {
    const cartInfo = JSON.parse(window.localStorage.getItem('currentOrder')).data;
    cartId = cartInfo.number;
    cartToken = cartInfo.token;

    const response = await $.ajax({
      url: `https://highline-bff.bonobos.com/api/carts/${cartId}/promotion`,
      type: requestMethod,
      headers: {
        Accept: 'application/json;v=2.0;schema=gramercy',
        'Content-type': 'application/json',
        'X-Cart-Token': cartToken,
        'X-Client-Authentication-Token': authToken,
      },
      data: JSON.stringify(requestData),
    });

    utils.logger.debug(`Finishing ${action} coupon action`);
    return response;
  } catch (error) {
    utils.logger.debug(`Error on ${action} coupon: ${error}`);
    return null;
  }
}

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse.cart.total;
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
  finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  // remove code if it was successfully applied so we are prepared to test the next code
  // successful responses contain a cart object, failed responses only contain an errors object
  if (applyCodeResponse.cart) {
    await applyOrRemoveCode(promoCode, utils, 'remove');
  }

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
