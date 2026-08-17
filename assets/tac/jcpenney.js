const BASE_API_URL = 'https://order-api.jcpenney.com/order-api/v1/accounts/';
const DISCOUNTS_ENDPOINT = '/draft-order/adjustment/discounts';
const DRAFT_ORDER_ENDPOINT = '/draft-order?expand=status';

const accountId = (document.cookie.match('ACCOUNT_ID=([^;]*)') || [])[1];
const accessToken = (document.cookie.match('Access_Token=([^;]*)') || [])[1];
const authHeader = `Bearer ${accessToken}`;
const headers = {
  'content-type': 'application/json',
  Authorization: authHeader,
};

// requestMethod: POST for applying code
// requestMethod: DELETE for removing code
async function applyOrRemoveCode(orderInfo, promoCode, utils, requestMethod) {
  const action = requestMethod === 'POST' ? 'applying' : 'removing';
  let discountId;
  let requestUrl = `${BASE_API_URL}${accountId}${DISCOUNTS_ENDPOINT}`;

  // if we're removing the code, we need to get the discount id
  if (requestMethod === 'DELETE') {
    discountId = (orderInfo && orderInfo.adjustments && orderInfo.adjustments[0] && orderInfo.adjustments[0].id) || '';
    requestUrl = `${requestUrl}/${discountId}`;
  }

  try {
    const response = await $.ajax({
      url: requestUrl,
      type: requestMethod,
      xhrFields: {
        withCredentials: true,
      },
      headers,
      data: JSON.stringify({
        code: promoCode,
        serialNumber: null,
      }),
    });

    utils.logger.debug(`Finished ${action} code`);
    return response;
  } catch (error) {
    utils.logger.debug(`Error ${action} code: ${error}`);
    return null;
  }
}

async function getOrderInfo(utils) {
  try {
    const response = await $.ajax({
      url: `${BASE_API_URL}${accountId}${DRAFT_ORDER_ENDPOINT}`,
      type: 'GET',
      headers,
    });

    utils.logger.debug('Finished getting order info');
    return response;
  } catch (error) {
    utils.logger.debug(`Order info fetching error: ${error}`);
    return null;
  }
}

async function updatePrice(orderInfo, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = orderInfo.totals[0].amount;
  } catch (error) {
    utils.logger.debug(`Error updating price ${error}`);
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
  let orderInfo = null;

  await applyOrRemoveCode(orderInfo, promoCode, utils, 'POST');
  orderInfo = await getOrderInfo(utils);
  finalPrice = await updatePrice(orderInfo, cartPriceSelector, originalPrice, utils);

  if (isApplyBest === true) {
    window.location = window.location.href;
    await utils.wait(500);
  } else {
    await applyOrRemoveCode(orderInfo, promoCode, utils, 'DELETE');
  }

  return Number(utils.parsePrice(finalPrice));
}

window.tacSubmit = tacSubmit;
