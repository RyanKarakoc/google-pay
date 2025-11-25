document.addEventListener("DOMContentLoaded", (event) => {
    if (google && paypal.Googlepay) {
        httpGet();
        onGooglePayLoaded().catch(console.log);
    }
})



function httpGet() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "npors.json", false);
    xmlHttp.send(null);
    console.log(xmlHttp.responseText);
    return xmlHttp.responseText;
}


/*
* Define the version of the Google Pay API referenced when creating your
* configuration
*/
const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
};

let paymentsClient = null
let allowedPaymentMethods = null
let merchantInfo = null;

//const isReadyToPayRequest = {
//    "apiVersion": 2,
//    "apiVersionMinor": 0,
//    "allowedPaymentMethods": [
//        {
//            "type": "CARD",
//            "parameters": {
//                "allowedAuthMethods": ["PAN_ONLY", "CRYPTOGRAM_3DS"],
//                "allowedCardNetworks": ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"]
//            }
//        }
//    ]
//};



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

    paymentDataRequest.merchantInfo = {
        merchantName: 'Example Merchant',
        merchantId: '12345678901234567890'
    };

    const allowedPaymentMethods = [
        {
            "type": "PAYMENT_GATEWAY",
            "parameters": {
                "allowedAuthMethods": ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                "allowedCardNetworks": ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"]
            }
        }
    ];

    const merchantInfo = {
        merchantName: 'Example Merchant',
        merchantId: '12345678901234567890'
    };

    paymentDataRequest.allowedPaymentMethods = allowedPaymentMethods;
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    paymentDataRequest.merchantInfo = merchantInfo;
    paymentDataRequest.callbackIntents = ["PAYMENT_AUTHORIZATION"];
    return paymentDataRequest;
}

function onPaymentAuthorized(paymentData) {
    console.log(5)

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
    return new google.payments.api.PaymentsClient({ environment: 'TEST' });
}

async function onGooglePayLoaded() {
    const paymentsClient = getGooglePaymentsClient();
    //const { allowedPaymentMethods } = await getGooglePayConfig();

    const allowedPaymentMethods = [
        {
            "type": "CARD",
            "parameters": {
                "allowedAuthMethods": ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                "allowedCardNetworks": ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"]
            }
        }
    ];

    paymentsClient
        .isReadyToPay(getGoogleIsReadyToPayRequest(allowedPaymentMethods))
        .then(function (response) {
            if (response.result) {
                addGooglePayButton();
            }
        })
        .catch(function (err) {
            console.error(err);
        });
}

function addGooglePayButton() {
    const paymentsClient = getGooglePaymentsClient();
    const button = paymentsClient.createButton({
        onClick: onGooglePaymentButtonClicked,
    });
    document.getElementById("container").appendChild(button);
}

function getGoogleTransactionInfo() {
    return {
        displayItems: [
            {
                label: "Subtotal",
                type: "SUBTOTAL",
                price: "100.00",
            },
            {
                label: "Tax",
                type: "TAX",
                price: "10.00",
            },
        ],
        countryCode: "US",
        currencyCode: "USD",
        totalPriceStatus: "FINAL",
        totalPrice: "110.00",
        totalPriceLabel: "Total",
        merchantName: 'Example Merchant',
    };
}

async function onGooglePaymentButtonClicked() {
    const paymentDataRequest = Object.assign({}, baseRequest);

    paymentDataRequest.merchantInfo = {
        merchantName: 'Example Merchant',
        merchantId: '12345678901234567890'
    };

    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();

    console.log(1)

    const paymentsClient = getGooglePaymentsClient();

    console.log(2)
    //paymentsClient.loadPaymentData(paymentDataRequest);

    console.log(paymentDataRequest)

    paymentsClient.loadPaymentData(paymentDataRequest).then(function (paymentData) {
        // if using gateway tokenization, pass this token without modification
        //paymentToken = paymentData.paymentMethodData.tokenizationData.token;
        console.log(3)
    }).catch(function (err) {
        // show error in developer console for debugging
        console.error(err);
    });
}

async function processPayment(paymentData) {
    try {
        const { currencyCode, totalPrice } = getGoogleTransactionInfo();
        const order = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: currencyCode,
                        value: totalPrice,
                    },
                },
            ],
        };
        /* Create Order */
        const { id } = await fetch(`/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(order),
        }).then((res) => res.json());
        const { status } = await paypal.Googlepay().confirmOrder({
            orderId: id,
            paymentMethodData: paymentData.paymentMethodData,
        });
        if (status === "APPROVED") {
            /* Capture the Order */
            const captureResponse = await fetch(`/orders/${id}/capture`, {
                method: "POST",
            }).then((res) => res.json());
            return { transactionState: "SUCCESS" };
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