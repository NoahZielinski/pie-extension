// Constants for URL and headers
const AJAX_URL = 'https://www.amazon.com/gp/buy/spc/handlers/add-giftcard-promotion.html/ref=ox_pay_page_gc_add';
const AJAX_HEADERS = {
  'x-amz-checkout-page': 'spc',
  'x-amz-checkout-transtion': 'ajax',
  'x-amz-checkout-type': 'spp',
};

async function tacSubmit({ utils, promoCode, cartPriceSelector, currentPrice, isApplyBest }) {
  // Initialize finalPrice with originalPrice
  let finalPrice = currentPrice;

  // Try to find the coupon and update finalPrice
  try {
    finalPrice = $(promoCode).find(cartPriceSelector).text();
  } catch (error) {
    // Handle error
  }

  // If the final price is less than the original price, update the text in the couponSelector
  if (Number(utils.parsePrice(finalPrice)) < currentPrice) {
    $(cartPriceSelector).text(finalPrice);
  }

  // Make an AJAX call
  const ajaxCall = $.ajax({
    type: 'post',
    url: AJAX_URL,
    headers: AJAX_HEADERS,
    data: {
      purchaseTotal: finalPrice, // Pass finalPrice
      claimcode: promoCode, // Pass couponCode
      disablegc: '',
      returnjson: 1,
      returnFullHTML: 1,
      hasWorkingJavascript: 1,
      fromAnywhere: 0,
      cachebuster: Date.now(), // Pass current timestamp
    },
  });

  // Wait for the AJAX call to complete
  await ajaxCall.done(() => {
    utils.logger.debug('Finishing applying codes'); // Log the completion of applying codes
  });

  // If reloadPage is true, reload the page and wait for 5 seconds
  if (isApplyBest === true) {
    window.location = window.location.href;
    await utils.wait(5000);
  }

  // Return the final price
  return Number(utils.parsePrice(finalPrice));
}

// Assign tacSubmit to the global window object
window.tacSubmit = tacSubmit;
