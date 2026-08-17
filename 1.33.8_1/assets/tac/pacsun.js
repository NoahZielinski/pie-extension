async function applyCode(promoCode, utils) {
  const csrfToken = $('input[name=csrf_token]').val();
  const requestUrl = `/on/demandware.store/Sites-pacsun-Site/default/Cart-AddCoupon?couponCode=${promoCode}&csrf_token=${csrfToken}`;

  try {
    const response = await $.ajax({
      url: requestUrl,
      type: 'GET',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(promoCode, utils, removeCodeId) {
  const requestUrl = `/on/demandware.store/Sites-pacsun-Site/default/Cart-RemoveCouponLineItem?code=${promoCode}&uuid=${removeCodeId}`;

  try {
    const response = await $.ajax({
      url: requestUrl,
      type: 'GET',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
      },
    });

    utils.logger.debug('Finishing removing coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error removing coupon: ${error}`);
    return null;
  }
}

async function fetchCodeId(applyCodeResponse, promoCode) {
  let codeId = '';

  try {
    const { discounts } = applyCodeResponse.totals;
    const promoKey = Object.keys(discounts || {}).find((key) => discounts[key]?.couponCode.toLowerCase() === promoCode.toLowerCase());
    codeId = discounts[promoKey]?.UUID;
  } catch (e) {
    // failed to get promo code ID
  }

  return codeId;
}

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse?.totals?.grandTotal || originalPrice;
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
  } else if (applyCodeResponse?.totals) {
    const removeCodeId = await fetchCodeId(applyCodeResponse, promoCode);
    await removeCode(promoCode, utils, removeCodeId);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
