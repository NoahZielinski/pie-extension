// Define constants for hard-coded strings
const BASE_URL = 'https://www.homedepot.com';
const PROMO_ADD_ENDPOINT = '/mcc-checkout/v2/promo/add';
const PROMO_DELETE_ENDPOINT = '/mcc-checkout/v2/promo/delete/';
const TOTAL_PRICE_SELECTOR = 'div[data-automation-id="total_price"]';

async function tacSubmit({ utils, promoCode, runState, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  // Function to apply promo code
  async function applyPromoCode() {
    const request = $.ajax({
      url: BASE_URL + PROMO_ADD_ENDPOINT,
      type: 'POST',
      data: JSON.stringify({
        PromotionUpdateRequest: {
          promotionCodes: [promoCode],
        },
      }),
      dataType: 'application/json;charset=utf-8',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
    });

    await request.done(() => {
      utils.logger.debug('Finishing code application');
    });

    return request;
  }

  // Function to remove promo code
  async function removePromoCode() {
    const request = $.ajax({
      url: BASE_URL + PROMO_DELETE_ENDPOINT + promoCode,
      type: 'POST',
      headers: {
        Accept: 'application/json',
        'content-type': 'application/json',
      },
    });

    await request.done(() => {
      utils.logger.debug('Removing code');
    });
  }

  // Apply promo code and update final price
  const response = await applyPromoCode();
  finalPrice =
    response && response.checkoutModel && response.checkoutModel.errorModel
      ? originalPrice
      : response && response.checkoutModel && response.checkoutModel.orderModel && response.checkoutModel.orderModel.orderAmount;
  $(TOTAL_PRICE_SELECTOR).text($.formatPrice(finalPrice));

  // Remove promo code if shouldRefreshPage is false
  if (!isApplyBest) {
    await removePromoCode();
  } else {
    window.location = window.location.href;
    await utils.wait(200);
  }

  return Number(utils.parsePrice(finalPrice));
}

window.tacSubmit = tacSubmit;
