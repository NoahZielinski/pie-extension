// Constants for URLs
const APPLY_COUPON_URL = 'https://www.orbitz.com/Checkout/applyCoupon';
const REMOVE_COUPON_URL = 'https://www.orbitz.com/Checkout/removeCoupon';

// Function to apply coupon
async function applyCoupon(requestData, currentUrl, currentPrice, utils) {
  const applyCodeData = requestData;
  let ajaxRequest;
  let applyCodeResponse;
  if (currentUrl.match('/Hotel')) {
    applyCodeData.oldTripTotal = currentPrice;
    applyCodeData.oldTripGrandTotal = currentPrice;
    applyCodeData.productType = 'hotel';
    ajaxRequest = $.ajax({
      url: APPLY_COUPON_URL,
      method: 'POST',
      data: applyCodeData,
    });
    await ajaxRequest.done(() => {
      utils.logger.debug('Finishing applying code');
    });
    applyCodeResponse = [ajaxRequest, 'hotel'];
  } else {
    applyCodeData.productType = 'multiitem';
    ajaxRequest = $.ajax({
      url: APPLY_COUPON_URL,
      method: 'POST',
      data: applyCodeData,
    });
    await ajaxRequest.done(() => {
      utils.logger.debug('Finishing coupon application');
    });
    applyCodeResponse = [ajaxRequest, 'package'];
  }
  return applyCodeResponse;
}

// Function to update price
function updatePrice(applyCouponResponse, utils, originalPrice, cartPriceSelector) {
  let newPrice;
  try {
    const { updatedPriceModel } = applyCouponResponse[0];
    const productType = applyCouponResponse[1];
    if (productType === 'hotel' && updatedPriceModel) {
      updatedPriceModel.forEach((item) => {
        if (item.description === 'total') {
          newPrice = utils.parsePrice(item.value);
        }
      });
    } else if (productType === 'package' && updatedPriceModel) {
      updatedPriceModel.forEach((item) => {
        if (item.description === 'finalTripTotal') {
          newPrice = utils.parsePrice(item.value);
        }
      });
    } else {
      newPrice = originalPrice;
    }
    if (Number(utils.parsePrice(newPrice)) < originalPrice) {
      $(cartPriceSelector).text(newPrice);
    }
  } catch (error) {
    utils.logger.debug('Error updating price');
    newPrice = originalPrice;
  }

  return newPrice;
}

// Function to remove coupon
async function removeCoupon(requestData, utils) {
  const removeCodeData = requestData;
  removeCodeData.tlCouponRemove = 1; // Remove coupon
  const removeCouponRequest = $.ajax({
    url: REMOVE_COUPON_URL,
    method: 'POST',
    data: removeCodeData,
  });
  await removeCouponRequest.done(() => {
    utils.logger.debug('Removing code');
  });
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const currentUrl = window.location.href;
  const tripId = (currentUrl.match('tripid=([^&]*)') || [])[1];
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  // Prepare request data
  const requestData = {
    couponCode: promoCode,
    tlCouponCode: promoCode,
    tlCouponAttach: 1, // Attach coupon
    tripid: tripId,
    binPrefix: '',
  };

  // Apply coupon and get the result
  const applyCouponResult = await applyCoupon(requestData, currentUrl, currentPrice, utils);

  // Update the price based on the response
  finalPrice = updatePrice(applyCouponResult, utils, originalPrice, cartPriceSelector);

  // Refresh the page if required
  if (isApplyBest === true) {
    window.location = window.location.href;
    await utils.wait(300);
  } else {
    // Remove the coupon
    await removeCoupon(requestData, utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Expose the function to the global scope
window.tacSubmit = tacSubmit;
