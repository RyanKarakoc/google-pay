/*
* Define the version of the Google Pay API referenced when creating your
* configuration
*/
const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
};

// Define the isReadyToPayRequest object
const isReadyToPayRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
        {
            type: 'CARD',
            parameters: {
                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                allowedCardNetworks: ['VISA', 'MASTERCARD']
            }
        }

    ]
};

let paymentsClient = null,
    allowedPaymentMethods = null,
    merchantInfo = null;
/* Configure your site's support for payment methods supported by the Google Pay */
function getGoogleIsReadyToPayRequest(allowedPaymentMethods) {
    return Object.assign({}, baseRequest, {
        allowedPaymentMethods: allowedPaymentMethods,
    });
}
/* Fetch Default Config from PayPal via PayPal SDK */
async function getGooglePayConfig() {
    if (allowedPaymentMethods == null || merchantInfo == null) {
        const googlePayConfig = await paypal.Googlepay().config();
        allowedPaymentMethods = googlePayConfig.allowedPaymentMethods;
        merchantInfo = googlePayConfig.merchantInfo;
    }
    return {
        allowedPaymentMethods,
        merchantInfo,
    };
}
/* Configure support for the Google Pay API */
async function getGooglePaymentDataRequest() {
    const paymentDataRequest = Object.assign({}, baseRequest);
    const { allowedPaymentMethods, merchantInfo } = await getGooglePayConfig();
    paymentDataRequest.allowedPaymentMethods = allowedPaymentMethods;
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    paymentDataRequest.merchantInfo = merchantInfo;
    paymentDataRequest.callbackIntents = ["PAYMENT_AUTHORIZATION"];
    return paymentDataRequest;
}
function onPaymentAuthorized(paymentData) {
    return new Promise(function (resolve, reject) {
        processPayment(paymentData)
            .then(function (data) {
                resolve({ transactionState: "SUCCESS" });
            })
            .catch(function (errDetails) {
                resolve({ transactionState: "ERROR" });
            });
    });
}
function getGooglePaymentsClient() {
    if (paymentsClient === null) {
        paymentsClient = new google.payments.api.PaymentsClient({
            environment: "TEST", // or "PRODUCTION"
            paymentDataCallbacks: {
                onPaymentAuthorized: onPaymentAuthorized,
            },
        });
    }
    return paymentsClient;
}

/**
 * Initialize Google PaymentsClient after Google-hosted JavaScript has loaded
 *
 * Display a Google Pay payment button after confirmation of the viewer's
 * ability to pay.
 */
function onGooglePayLoaded() {
    const paymentsClient = getGooglePaymentsClient();
    paymentsClient.isReadyToPay(isReadyToPayRequest)
        .then(function (response) {
            if (response.result) {
                addGooglePayButton();
            }
        })
        .catch(function (err) {
            console.error(err);
        });
}
/**
 * Add a Google Pay purchase button
 */
function addGooglePayButton() {
    const paymentsClient = getGooglePaymentsClient();
    const button =
        paymentsClient.createButton({
            onClick: onGooglePaymentButtonClicked /* To be defined later */,
            allowedPaymentMethods: allowedPaymentMethods,
            buttonType: 'plain',
            buttonSizeMode: 'fill',
        });
    document.getElementById('container').appendChild(button);
}

/* Note: the `googlePayConfig` object in this request is the response from `paypal.Googlepay().config()` */
async function getGooglePaymentDataRequest() {
    const googlePayConfig = await paypal.Googlepay().config();
    const paymentDataRequest = Object.assign({}, baseRequest);
    paymentDataRequest.allowedPaymentMethods = googlePayConfig.allowedPaymentMethods;
    // Uncomment for Japan integrations only
    // paymentDataRequest.allowedPaymentMethods[0].parameters.allowedAuthMethods = ['PAN_ONLY'];
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    paymentDataRequest.merchantInfo = googlePayConfig.merchantInfo;
    paymentDataRequest.callbackIntents = ["PAYMENT_AUTHORIZATION"];
    return paymentDataRequest;
}
function getGoogleTransactionInfo() {
    return {
        currencyCode: 'GBP',
        totalPriceStatus: 'FINAL',
        totalPrice: '24.00' // Your amount
    }
}

/* Show Google Pay payment sheet when Google Pay payment button is clicked */
async function onGooglePaymentButtonClicked() {
    const paymentDataRequest = await getGooglePaymentDataRequest();
    const paymentsClient = getGooglePaymentsClient();
    paymentsClient.loadPaymentData(paymentDataRequest);
}



async function processPayment(paymentData) {
    try {
        // GET ORDER ID FROM NPORS ENDPOINT
        async function getId() {
            return fetch('https://my.npors.com/npors/ajax/paypal/generate_order_sandbox.asp')
                .then(response => response.json())
                .then(data => data)
                .catch(error => console.error('Error:', error));
        }

        const { id } = await getId();

        // GET PAYMENT MEHOD STATUS FROM GOOGLE API
        const { status } = await paypal.Googlepay().confirmOrder({
            orderId: id,
            paymentMethodData: paymentData.paymentMethodData,
        });

        if (status === "APPROVED") {
            // CAPTURE STATUS WITH NPORS ENDPOINT
            const fetchRes = await fetch(`https://my.npors.com/npors/ajax/paypal/capture_payment_sandbox.asp?<%=qsGet("a="&md5_string&"&pl_id="&pl_id)%>`, {
                method: 'POST',
                headers: {
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: "order_id=" + id
            });

            const response = await fetchRes.json();

            if (response.status === "COMPLETED") {
                return ({ transactionState: 'SUCCESS' });
            }
            else {
                return ({
                    transactionState: 'ERROR',
                    error: {
                        intent: 'PAYMENT_AUTHORIZATION',
                        message: 'TRANSACTION FAILED',
                    }
                })
            }
        } else {
            return { transactionState: "ERROR" };
        }
    } catch (err) {
        return {
            transactionState: "ERROR",
            error: {
                message: err.message,
            },
        };
    }
}