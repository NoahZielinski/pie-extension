async function applyCode(promoCode, utils) {
  const isSuperChewer = window.location.pathname.includes('super-chewer');
  const isGift = window.location.pathname.includes('/gift/');
  let requestPartialUrl = '/subscribe';
  if (isGift) {
    requestPartialUrl = isSuperChewer ? '/super-chewer/gift' : '/gift';
  } else {
    requestPartialUrl = isSuperChewer ? '/subscribe/super-chewer' : '/subscribe';
  }

  try {
    const response = await $.ajax({
      url: `${requestPartialUrl}/subscription_coupon`,
      type: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      data: `_method=patch&subscription_coupon[coupon_code]=${promoCode}`,
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

  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

// Expose the tacSubmit function to the global scope
window.tacSubmit = tacSubmit;
