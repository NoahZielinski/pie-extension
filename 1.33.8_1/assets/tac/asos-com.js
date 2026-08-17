async function applyOrRemoveCode(promoCode, utils, action) {
  const authToken = ($('script')
    .text()
    .match(/"accessToken":[\s\n]*?"(.+?)"/) || [])[1];
  const bagOrigin = (document.cookie.match(/BagOrigin=(.*?);/) || [])[1];
  const bagId = (document.cookie.match(/bid=([^&;]+)?/) || [])[1];
  let requestMethod;
  let requestData;

  if (action === 'apply') {
    requestMethod = 'PUT';
    requestData = JSON.stringify({
      discountCode: promoCode,
    });
  } else if (action === 'remove') {
    requestMethod = 'DELETE';
    requestData = '';
  }

  try {
    const response = await $.ajax({
      url: `https://secure.asos.com/api/commerce/bag/v4/bags/${bagId}/discounts?expand=delivery,total`,
      method: requestMethod,
      headers: {
        'Asos-Bag-Origin': bagOrigin,
        'Asos-C-Name': 'asos.commerce.checkout.web',
        'Asos-C-Plat': 'web',
        Authorization: `Bearer ${authToken}`,
        'content-type': 'application/json',
      },
      data: requestData,
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
    newPrice = applyCodeResponse.bag.total.total.text;
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

// Expose the tacSubmit function to the global scope
window.tacSubmit = tacSubmit;
