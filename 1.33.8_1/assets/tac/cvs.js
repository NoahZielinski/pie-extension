async function applyCode(promoCode, utils) {
  const fingerprintId = window.sessionStorage.getItem('cvsbfp_v2') || '';

  const requestData = {
    request: {
      header: {
        apiKey: 'a2ff75c6-2da7-4299-929d-d670d827ab4a',
        appName: 'CVS_WEB',
        channelName: 'WEB',
        deviceToken: 'BLNK',
        deviceType: 'DESKTOP',
        lineOfBusiness: 'RETAIL',
      },
    },
    requestPayload: {
      couponCode: promoCode,
      isECCouponAllowed: 'Y',
      couponType: 'ATG',
      enableSplitFulfillment: 'Y',
    },
  };

  try {
    const response = await $.ajax({
      url: 'https://www.cvs.com/RETAGPV3/RxExpress/V2/applyCoupon',
      method: 'POST',
      headers: {
        accept: 'application/json',
        'accept-language': 'en-US,en;q=0.9',
        channeltype: 'WEB',
        'content-type': 'application/json',
        'x-client-fingerprint-id': fingerprintId,
      },
      data: JSON.stringify(requestData),
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
    newPrice = applyCodeResponse.response.details.orderDetails.orderSummary.total;
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

// Assign the function to the window object
window.tacSubmit = tacSubmit;
