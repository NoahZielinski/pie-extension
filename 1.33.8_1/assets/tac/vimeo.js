async function applyCode(promoCode, utils) {
  const token = ($('script').text().match('"xsrft":"([^,]*)"') || [])[1];
  const requestData = JSON.stringify({
    action: 'promo_code',
    promo_code: promoCode,
    token,
  });

  try {
    const response = await $.ajax({
      url: `${window.location.href}?json=1`,
      type: 'post',
      headers: {
        'content-type': 'application/json',
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

async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse.formatted_total || originalPrice;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function applyBestCode(promoCode, utils) {
  const PROMO_CODE_INPUT_SELECTOR = '#promo_code_input';
  const SUBMIT_PROMO_BUTTON_SELECTOR = '#submit_promo_button';
  const ADD_PROMO_LINK_SELECTOR = '#add_promo_link';
  const PROMO_CONTAINS_SELECTOR = 'span:contains("Promo:")';

  $('#add_promo_link').click();
  await utils.wait(800);
  $(`${PROMO_CODE_INPUT_SELECTOR}, ${ADD_PROMO_LINK_SELECTOR}, ${PROMO_CONTAINS_SELECTOR}`).val(promoCode);
  await utils.wait(300);

  try {
    // Trigger events on promo code input field
    const field = document.querySelector(PROMO_CODE_INPUT_SELECTOR);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change'));
    field.dispatchEvent(new Event('keyup'));
    field.dispatchEvent(new Event('blur'));
    field.dispatchEvent(new Event('focus'));

    // Click on submit promo button
    document.querySelector(SUBMIT_PROMO_BUTTON_SELECTOR).click();
  } catch (error) {
    /* empty */
  }

  await utils.wait(200);
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest === true) {
    await applyBestCode(promoCode, utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign function to global scope
window.tacSubmit = tacSubmit;
