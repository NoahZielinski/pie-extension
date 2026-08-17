async function applyCode(promoCode, utils) {
  const ultaSite = (document.cookie.match(/ULTASITE=([^&;]+)?/) || [])[1];
  const userAgent = (document.cookie.match(/User-Agent=([^&;]+)?/) || [])[1];
  const dtpc = (document.cookie.match(/dtPC=([^&;]+)?/) || [])[1];
  let gtiToken = '';

  try {
    const keyObj = window.localStorage.getItem('DSOTF_LOGIN_HINT_KEY');
    gtiToken = keyObj.gti;
  } catch (error) {
    utils.logger.debug(`Error getting token: ${error}`);
  }

  const graphqlQuery = {
    query: `mutation ApplyCoupon(
      $url: JSON
      $moduleParams: JSON
      $contentId: String
      $echoParams: JSON
    ) {
      Page: ApplyCoupon(
        url: $url
        moduleParams: $moduleParams
        contentId: $contentId
        echoParams: $echoParams
      ) {
        content
        meta
        __typename
      }
    }`,
    variables: {
      moduleParams: {
        couponCode: promoCode,
        gti: gtiToken,
        loginStatus: 'anonymous',
      },
      url: { path: '/bag' },
    },
    operationName: 'ApplyCoupon',
  };

  try {
    const response = await $.ajax({
      url: `/v1/client/dxl/graphql?ultasite=${ultaSite}&User-Agent=${userAgent}`,
      type: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Dtpc': dtpc,
        'X-Ulta-Client-Locale': ultaSite,
        'X-Ulta-Dxl-Query-Id': 'ApplyCoupon',
      },
      data: JSON.stringify(graphqlQuery),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(promoCode, utils) {
  const ultaSite = (document.cookie.match(/ULTASITE=([^&;]+)?/) || [])[1];
  const userAgent = (document.cookie.match(/User-Agent=([^&;]+)?/) || [])[1];
  const dtpc = (document.cookie.match(/dtPC=([^&;]+)?/) || [])[1];
  let gtiToken = '';

  try {
    const keyObj = window.localStorage.getItem('DSOTF_LOGIN_HINT_KEY');
    gtiToken = keyObj.gti;
  } catch (error) {
    utils.logger.debug(`Error getting token: ${error}`);
  }

  const graphqlQuery = {
    query: `mutation RemoveCoupon(
      $url: JSON
      $moduleParams: JSON
      $contentId: String
      $echoParams: JSON
    ) {
      Page: RemoveCoupon(
        url: $url
        moduleParams: $moduleParams
        contentId: $contentId
        echoParams: $echoParams
      ) {
        content
        meta
        __typename
      }
    }`,
    variables: {
      moduleParams: {
        couponCode: promoCode,
        gti: gtiToken,
        loginStatus: 'anonymous',
      },
      url: { path: '/bag' },
    },
    operationName: 'RemoveCoupon',
  };

  try {
    const response = await $.ajax({
      url: `/v1/client/dxl/graphql?ultasite=${ultaSite}&User-Agent=${userAgent}`,
      type: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Dtpc': dtpc,
        'X-Ulta-Client-Locale': ultaSite,
        'X-Ulta-Dxl-Query-Id': 'RemoveCoupon',
        'X-Ulta-Graph-Module-Name': 'Coupon',
        'X-Ulta-Graph-Sub-Type': 'removecoupon',
        'X-Ulta-Graph-Type': 'mutation',
      },
      data: JSON.stringify(graphqlQuery),
    });

    utils.logger.debug('Finishing removing coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error removing coupon: ${error}`);
    return null;
  }
}

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const stringResponse = JSON.stringify(applyCodeResponse);
    const totalBlob = (stringResponse.match(/"estimatedTotal":\s*({[^}]+)?/) || [])[1];
    newPrice = (totalBlob.match(/"itemValue":\s*"([^"]+)?"/) || [])[1] || originalPrice;
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

  // Clear existing applied coupons to avoid cart increase
  const existingCouponsToRemovePromises = [...document.querySelectorAll('.Coupon button[aria-label="delete"]')].map(async element => {
    element.click()
    await utils.wait(1000)
    return true
  })
  await Promise.all(existingCouponsToRemovePromises)

  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(500);
  } else {
    await removeCode(promoCode, utils);
  }
  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
