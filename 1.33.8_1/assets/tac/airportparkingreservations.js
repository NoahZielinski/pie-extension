async function applyCode(promoCode, utils) {
  const token = ($('script')
    .text()
    .match(/"token":"(.*?)"/) || [])[1];
  const rawTokenScript = $('script:contains(window.Laravel)').text();
  const csrfToken = (rawTokenScript.match(/"csrfToken":"(.*?)"/) || [])[1];

  try {
    const response = await $.ajax({
      url: `/checkout/${token}/coupon`,
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json;charset=UTF-8',
        'X-CSRF-TOKEN': csrfToken,
      },
      data: JSON.stringify({ code: promoCode }),
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
    if (applyCodeResponse.errors) {
      newPrice = originalPrice;
    } else {
      const balanceDue = applyCodeResponse.pricing.balance_due;
      const payNow = applyCodeResponse.pricing.pay_now;
      newPrice = balanceDue + payNow;
    }
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(`$${newPrice}`);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(1000);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the tacSubmit function to the window object
window.tacSubmit = tacSubmit;
