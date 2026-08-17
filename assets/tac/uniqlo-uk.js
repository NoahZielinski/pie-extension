async function applyCode(promoCode, utils) {
  const requestData = {
    dwfrm_cart_couponCode: promoCode,
    dwfrm_cart_addCoupon: 'dwfrm_cart_addCoupon',
  };

  try {
    // have to append the of each item to the request
    // if you don't it empties the cart instead of applying the coupon :D
    const quantityElements = $('select[name*="dwfrm_cart_shipments_i"][name*="_quantity"]');

    // eslint-disable-next-line no-restricted-syntax
    for (const element of quantityElements) {
      const quantityName = $(element).attr('name');
      const quantityValue = $(element).find('option:selected').text();
      requestData[quantityName] = quantityValue;
    }

    const response = await $.ajax({
      url: '/uk/en/cart?format=ajax',
      type: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
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

async function removeCode(promoCode, utils) {
  const requestData = {
    dwfrm_cart_couponCode: promoCode,
    dwfrm_cart_coupons_i0_deleteCoupon: 'dwfrm_cart_coupons_i0_deleteCoupon',
  };

  try {
    // have to append the of each item to the request
    // if you don't it empties the cart instead of removing the coupon :D
    const quantityElements = $('select[name*="dwfrm_cart_shipments_i"][name*="_quantity"]');

    // eslint-disable-next-line no-restricted-syntax
    for (const element of quantityElements) {
      const quantityName = $(element).attr('name');
      const quantityValue = $(element).find('option:selected').text();
      requestData[quantityName] = quantityValue;
    }

    const response = await $.ajax({
      url: '/uk/en/cart?format=ajax',
      type: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: requestData,
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
    newPrice = $(applyCodeResponse).find(cartPriceSelector).text();
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
