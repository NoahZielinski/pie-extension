const storeId = (document.cookie.match(/fulfillmentStoreId=([\d]+);/) || [])[1];
let tacRunState;

function getSubscriptionKey(utils) {
  let subscriptionKey = tacRunState?.tacMemory?.subscriptionKey;

  if (!subscriptionKey) {
    const scriptEl = $('#__NEXT_DATA__').text();
    try {
      const parsedScript = JSON.parse(scriptEl);
      subscriptionKey = parsedScript && parsedScript.runtimeConfig && parsedScript.runtimeConfig.BFF_API_SUBSCRIPTION_KEY;
      tacRunState.tacMemory = { subscriptionKey };
    } catch (error) {
      utils.logger.debug(`Error parsing script: ${error}`);
    }
  }
  return subscriptionKey;
}

async function getOrderId(utils) {
  const subscriptionKey = getSubscriptionKey(utils);
  let orderId = tacRunState?.tacMemory?.orderId;

  if (!orderId) {
    const orderIdAjaxResponse = $.ajax({
      url: `https://www.coles.com.au/api/bff/trolley/store/${storeId}?sortBy=recentlyAdded`,
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'X-Api-Version': 3,
      },
    });

    await orderIdAjaxResponse
      .done(() => {
        utils.logger.debug('Finished applying code');
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        utils.logger.debug(`Coupon apply error: ${errorThrown}`);
      });

    if (orderIdAjaxResponse) {
      orderId = orderIdAjaxResponse.responseJSON.orderId;
      tacRunState.tacMemory = { orderId };
    }
  }

  return orderId;
}

async function applyOrRemoveCode(promoCode, utils, requestMethod) {
  const subscriptionKey = getSubscriptionKey(utils);
  const orderId = await getOrderId(utils);

  try {
    const response = await $.ajax({
      url: `https://www.coles.com.au/api/bff/orders/${orderId}/promos/${promoCode}`,
      method: requestMethod,
      headers: {
        'content-type': 'application/json',
        'Ocp-Apim-Subscription-Key': subscriptionKey,
      },
      data: JSON.stringify({
        storeId,
      }),
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
    newPrice = applyCodeResponse.orderTotalPrice;
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

  tacRunState = runState;

  const applyCodeResponse = await applyOrRemoveCode(promoCode, utils, 'POST');
  finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest === true) {
    window.location = window.location.href;
    await utils.wait(200);
  } else {
    await applyOrRemoveCode(promoCode, utils, 'DELETE');
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign function to global scope
window.tacSubmit = tacSubmit;
