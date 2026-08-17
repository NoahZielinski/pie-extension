async function applyCode(promoCode, utils) {
  const requestBody = `com=shopcart&t=useCoupon&coupon_code=${promoCode}`;

  try {
    const response = await $.ajax({
      url: '/index.php',
      type: 'POST',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      data: requestBody,
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function applyCodeMobile(promoCode, utils) {
  const requestBody = `action=coupon&coupon_code=${promoCode}&new_coupon_version=1&c=api`;
  try {
    const response = await $.ajax({
      url: '/ajax/shopcart/setPointsOrCoupons/index.html',
      type: 'GET',
      headers: {
        accept: 'application/json, text/plain, */*',
      },
      data: requestBody,
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const responseJSON = JSON.parse(applyCodeResponse);
    newPrice = responseJSON.grandTotal;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

function updatePriceMobile(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const parsedResponse = JSON.parse(applyCodeResponse);
    const rawPrice = parsedResponse.result.cartData.cart_amount;
    newPrice = utils.parsePrice(rawPrice);
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
  const isMobile = window.location.href.includes('m.banggood.com');
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  if (isMobile) {
    const applyCodeResponseMobile = await applyCodeMobile(promoCode, utils);
    finalPrice = updatePriceMobile(applyCodeResponseMobile, cartPriceSelector, originalPrice, utils);
  } else {
    const applyCodeResponse = await applyCode(promoCode, utils);
    finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);
  }

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
