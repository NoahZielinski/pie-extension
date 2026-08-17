async function applyCode(promoCode, utils) {
  let csrfToken = $('[name="csrf_token"]').val();
  if (!csrfToken) {
    const csrfScript = $('#single-page-checkout').attr('data-react') || '';
    csrfToken = csrfScript.match(/"csrfToken":"(.+?)"/)?.[1] || '';
  }

  try {
    const response = await $.ajax({
      url: '/on/demandware.store/Sites-catfootwear_us-Site/default/Coupon-ApplyCoupon',
      type: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: {
        code: promoCode,
        csrf_token: csrfToken,
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(promoCode, utils) {
  let csrfToken = $('[name="csrf_token"]').val();
  if (!csrfToken) {
    const csrfScript = $('#single-page-checkout').attr('data-react') || '';
    csrfToken = csrfScript.match(/"csrfToken":"(.+?)"/)?.[1] || '';
  }

  try {
    const response = await $.ajax({
      url: '/on/demandware.store/Sites-catfootwear_us-Site/default/Coupon-RemoveCoupon',
      type: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: {
        code: promoCode,
        csrf_token: csrfToken,
      },
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
    const priceString = applyCodeResponse?.cart?.totals?.orderTotal;
    newPrice = Number(utils.parsePrice(priceString));
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
