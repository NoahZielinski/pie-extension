async function applyCode(promoCode, utils) {
  const sessionId =
    ($('#tracking_page_element')
      .attr('data-pageview')
      .match(/"si":"(.+?)"/) || [])[1] || '';
  const token =
    ($('script:contains(window.__APP_INITIAL_STATE__)')
      .text()
      .match(/"srt":"(.+?)"/) || [])[1] || '';
  const checkoutType = window.location.href.includes('/rgxo') ? 'rgxo' : 'rxo';

  try {
    const response = await $.ajax({
      url: `/${checkoutType}/ajax?action=addIncentive`,
      type: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        pageType: 'ryp',
        redemptionCode: promoCode,
        srt: token,
        sessionid: sessionId,
      }),
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
    newPrice = applyCodeResponse.modules.summary.total.amount.value.value;
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
    await utils.wait(2000);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
