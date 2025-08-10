// ==UserScript==
// @name         [sn0tspoon] Neopets Message Cleaner
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  Customizable message deletion - delete read messages, gift/purchase notifications, old messages, and custom keywords
// @author       nadinejun0
// @match        *://www.neopets.com/neomessages.phtml*
// @grant        none
// ==/UserScript==

(function() {
    // ===== CUSTOMIZABLE SETTINGS =====
    var DELETE_READ_MESSAGES = true;           // delete messages marked as "Read"
    var DELETE_GIFT_MESSAGES = true;           // delete messages with "Neocash Item Gift" in subject
    var DELETE_PURCHASE_MESSAGES = true;       // delete messages with "NC Item Purchase" in subject

    //delete messages older than specified days
    var DELETE_OLD_MESSAGES = true;   
    var OLD_MESSAGE_DAYS = 60;   // specify # of days
    
    // additional subject keywords to delete (case-insensitive)
    var ADDITIONAL_KEYWORDS = [
        // "keyword1",
        // "keyword2"
    ];


    
    // ===================================

    // helper function to check if a date is older than specified days
    function isOlderThanDays(dateText, days) {
        if (!dateText || !days) return false;
        
        try {
            // neopets date format: "19/7/2025 11:37am"
            // parse the date part and time part
            var parts = dateText.split(' ');
            if (parts.length < 2) return false;
            
            var datePart = parts[0]; // "19/7/2025"
            var timePart = parts[1]; // "11:37am"
            
            // split date into day/month/year
            var dateComponents = datePart.split('/');
            if (dateComponents.length !== 3) return false;
            
            var day = parseInt(dateComponents[0]);
            var month = parseInt(dateComponents[1]) - 1; // javascript months are 0-indexed
            var year = parseInt(dateComponents[2]);
            
            // parse time
            var hour = parseInt(timePart.split(':')[0]);
            var minute = parseInt(timePart.split(':')[1].replace(/[ap]m/i, ''));
            
            // adjust for am/pm
            if (timePart.toLowerCase().includes('pm') && hour !== 12) {
                hour += 12;
            } else if (timePart.toLowerCase().includes('am') && hour === 12) {
                hour = 0;
            }
            
            var messageDate = new Date(year, month, day, hour, minute);
            var now = new Date();
            var diffTime = now - messageDate;
            var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return diffDays > days;
        } catch (e) {
            console.log('Failed to parse date:', dateText, e);
            return false;
        }
    }

    $(function(){
        // clickable link
        var btn = $("<a href='#'><b>DELETE MESSAGES</b></a>").click(function(){
            $("input[name='checkbox_arr[]']").each(function(){
                var row = $(this).closest('tr');
                // get the status text from the last <td> cell.
                var status = row.find("td:last-child").text().trim();
                // get the subject text from the fourth <td> cell (0-indexed eq(3)).
                var subject = row.find("td:eq(3)").text().trim();
                // get the date text from the second <td> cell (0-indexed eq(1)).
                var dateText = row.find("td:eq(1)").text().trim();

                var shouldDelete = false;
                
                // check if message should be deleted based on settings
                if (DELETE_READ_MESSAGES && status === "Read") {
                    shouldDelete = true;
                }
                
                if (DELETE_GIFT_MESSAGES && subject.indexOf("Neocash Item Gift") !== -1) {
                    shouldDelete = true;
                }
                
                if (DELETE_PURCHASE_MESSAGES && subject.indexOf("NC Item Purchase") !== -1) {
                    shouldDelete = true;
                }
                
                if (DELETE_OLD_MESSAGES && isOlderThanDays(dateText, OLD_MESSAGE_DAYS)) {
                    shouldDelete = true;
                }
                
                // check additional keywords (case-insensitive)
                for (var i = 0; i < ADDITIONAL_KEYWORDS.length; i++) {
                    if (subject.toLowerCase().indexOf(ADDITIONAL_KEYWORDS[i].toLowerCase()) !== -1) {
                        shouldDelete = true;
                        break;
                    }
                }
                
                if (shouldDelete) {
                    $(this).prop('checked', true);
                }


                
            });
            $("select[name='action']").val('Delete Messages');
            $("form[action='modify_neomessages.phtml']").submit();
            return false;
        });
        $("a[href='/listgreetings.phtml']").parent().append('| ').append(btn);
    });
})();
