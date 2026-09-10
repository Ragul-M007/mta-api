/**
 * @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-22 12:14:11
 * @desc [description]
 * @desc [description]
 */

module.exports.Message = {


    Token: {
        SuccessMessage: {
            RevokeToken: "Token revoked",
            RefreshToken: "Session created and new token generated !"
        },
        FailureMessage: {
            RevokeToken: "Token revoke failed !",
            Config: "Token configuration error !",
            RefreshToken: "Refresh token generation failed !!",

        }
    },
        Transaction: {
        SuccessMessage: {
            Success: "Transaction success !",
            Initiated: "Transaction initiated !",
            Fetch: "Transaction fetched !"
        },
        FailureMessage: {
            Failed: "Transaction failed !",
            InvAmount: "Invalid Amount",
            Initiation: "Transaction initiation failed !",
            NoTrx: "No transaction found"
        }
    },
    Common: {
        SuccessMessage: {
            Fetch(data = 'Data') { return `${data} fetched successfully !` },
            Added(data = 'Data'){return `${data} added successfully !`},
            Creation(data = 'Data') { return `${data} created successfully !` },
            Updation(data = 'Data') { return `${data} updated successfully !` },
            Deletion(data = 'Data') { return `${data} deleted successfully !` },
            Removed(data = 'Data') { return `${data} removed successfully !` },
        EmailSent: "OTP has been sent to your registered Email ",
        ChangePassword:"Password has been changed successfully"
        },
        FailureMessage: {
            Fetch(data = 'Data') { return `${data} fetch failed, kindly retry !! ` },
            Added(data = 'Data'){return `${data} failed to add to the project!`},
            Creation(data = 'Data') { return `${data} creation failed, kindly retry !!` },
            RequiredDataNotFound(data = 'Data') { return `${data} required data some missing, kindly check !!` },
            Updation(data = 'Data') { return `${data} updation failed, kindly retry !!` },
            Deletion(data = 'Data') { return `${data} deletion failed, kindly retry !!` },
            NoDataFound(data = 'Data') { return `No ${data} found !!` },
            NoUserSeen(data = 'Data') { return `No ${data} seen !!` },
            AlreadyExists(data = 'Data') { return `${data} already exists !!` },
            Unauthorized: "Unauthorized !",

            NoData: "No data found !",
            SomethingWnWrng: "Something went wrong we are trying to fix it. Please try again later !",
            TokenExpired: "Login expired !",
            InternalServerError: "Internal server error. Please try again later !",
            RowRefNotFound: "Reference not found please check and try again !",
            DataAlreadyExists: "Data already exists !",
            NoAccessToDelete: "No access to delete !",
            InvalidRef: "Invalid reference please check and try again !",
            InvalidUser: "Invalid credentials, Please try again or click forget password to reset",
            EmailSent: "Your not regiter with us please sign up",
            ChangePassword:"Failed to update the Password",
            invalidtime:"Selected start time or end time is same for your meeting ,check and change timing and update "

        }
    },
}

