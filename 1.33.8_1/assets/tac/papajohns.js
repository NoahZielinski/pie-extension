// Define constants for the URLs
const VALIDATE_PROMO_URL = 'https://www.papajohns.com/order/validate-promo?promo-code=';
const APPLY_PROMO_URL = 'https://www.papajohns.com/order/apply-promo/';
const VIEW_CART_URL = 'https://www.papajohns.com/order/view-cart';

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  try {
    // Validate the promo code
    await $.get(VALIDATE_PROMO_URL + promoCode);
    // Apply the promo code
    await $.get(`${APPLY_PROMO_URL + promoCode}?promo-code=${promoCode}`);
  } catch (error) {
    // Log any errors
    utils.logger.debug('Validate error', error);
  }

  try {
    // Get the cart details
    const ajaxResponse = $.ajax({
      type: 'GET',
      url: VIEW_CART_URL,
    });

    // Log the completion of applying the coupon
    await ajaxResponse.done(() => {
      utils.logger.debug('Finishing applying coupon');
    });

    // Update the finalText with the text from the selector
    finalPrice = $(ajaxResponse.responseText).find(cartPriceSelector).text();
    // Update the text of the selector with the finalText
  } catch (error) {
    // Log any errors
    utils.logger.debug('Apply error', error);
    finalPrice = originalPrice;
  }

  if (Number(utils.parsePrice(finalPrice)) < originalPrice) {
    $(cartPriceSelector).text(finalPrice);
  }

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(200);
  }

  // Return the finalText
  return finalPrice;
}

// Assign the tacSubmit function to the window object
window.tacSubmit = tacSubmit;
