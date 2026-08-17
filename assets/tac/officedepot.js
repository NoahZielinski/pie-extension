// Base URL for the API calls
const BASE_URL = 'https://www.officedepot.com';

async function fetchCartInfo(utils, jSessionID, cloneID) {
  // Function to parse response headers
  const parseResponseHeaders = (headers) =>
    headers.split('\r\n').reduce((acc, current) => {
      const [key, value] = current.split(': ');
      acc[key] = value;
      return acc;
    }, {});

  let xhrResponse;
  const cartInfoResponse = $.ajax({
    url: `${BASE_URL}/async/cart/getCartInfo.do;jsessionid=${jSessionID}:${cloneID}`,
    type: 'GET',
  });
  await cartInfoResponse
    .done((data, textStatus, jqXHR) => {
      xhrResponse = jqXHR;
      utils.logger.debug('Finishing fetching cart info');
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      utils.logger.debug(`Cart info fetching error: ${errorThrown}`);
    });

  return {
    xhr: xhrResponse,
    responseHeaders: parseResponseHeaders(cartInfoResponse.getAllResponseHeaders()),
  };
}

async function applyOrRemoveCode(promoCode, utils, jSessionID, cloneID, action, applyCodeResponse = {}) {
  const applyCodeUrl = `${BASE_URL}/async/cart/addCoupon.do;jsessionid=${jSessionID}:${cloneID}`;
  const removeCodeUrl = `${BASE_URL}/async/cart/removeCoupon.do;jsessionid=${jSessionID}:${cloneID}`;
  const requestUrl = action === 'apply' ? applyCodeUrl : removeCodeUrl;

  const cartInfo = await fetchCartInfo(utils, jSessionID, cloneID);
  let couponCodeToRemove = promoCode;
  let csrfToken;
  let syncToken;

  try {
    const { xhr, responseHeaders } = cartInfo;
    csrfToken = responseHeaders['x-cart-csrftoken'];
    syncToken = xhr.responseJSON.data.syncToken;
    if (action === 'remove') {
      couponCodeToRemove = applyCodeResponse.data.cartCoupons[0].couponCode;
    }
  } catch (error) {
    utils.logger.debug('Error destructuring cart info');
  }

  const couponCode = action === 'apply' ? promoCode : couponCodeToRemove;

  const ajaxResponse = $.ajax({
    url: requestUrl,
    type: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-cart-csrftoken': csrfToken,
    },
    data: JSON.stringify({
      couponCode,
      syncToken,
    }),
  });

  await ajaxResponse
    .done(() => {
      utils.logger.debug('Finished applying code');
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      utils.logger.debug(`Coupon apply error: ${errorThrown}`);
    });

  return ajaxResponse;
}

async function updatePrice(applyCodeResponse, originalPrice, utils) {
  let isCouponValid = false;
  let newPrice;

  try {
    isCouponValid = applyCodeResponse.data.coupon.valid;

    if (isCouponValid) {
      newPrice = applyCodeResponse.data.summary.orderSummary.total;
    } else {
      newPrice = originalPrice;
    }
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $('#OdCart .od-cart-summary-total .od-cart-summary-field-value').text(`$${newPrice}`);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, currentPrice, isApplyBest }) {
  const globalSettingsText = $('script#globalSettings').text();
  const jSessionID = (globalSettingsText.match('"jSessionID" : "(.*)"') || [])[1];
  const cloneID = (globalSettingsText.match('"cloneID" : "(.*)"') || [])[1];
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyOrRemoveCode(promoCode, utils, jSessionID, cloneID, 'apply');
  finalPrice = await updatePrice(applyCodeResponse, originalPrice, utils);

  if (isApplyBest === true && applyCodeResponse.data.coupon.valid) {
    window.location = window.location.href;
    await utils.wait(200);
  } else {
    await applyOrRemoveCode(promoCode, utils, jSessionID, cloneID, 'remove', applyCodeResponse);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Expose the function to the global scope
window.tacSubmit = tacSubmit;
