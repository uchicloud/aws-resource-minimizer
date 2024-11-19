export const validateDateTag = 
    (obj: { [K: string]: string; }): boolean => {
    try {
        let { year, month, date } =
            /^(?<year>\d{4})\D?(?<month>\d{1,2})\D?(?<date>\d{0,2})$/
            .exec(obj.Key)?.groups ?? {year: '', month: '', date: ''};
        if (!year || !month)
            return true;
        
        if (month.length === 1) {
            month = '0' + month;
        }
        if (date && date.length === 1) {
            date = '0' + date;
        } else if (!date) {
            date = '01';
        }
        const test = new Date(`${year}-${month}-${date}`);
        return isNaN(test.getTime());
    } catch (e) {
        return false;
    }
};

export const isBeforeThisMonth = (obj: { [K: string]: string; }, thisMonth: Date): boolean => {
    try {
        let { year, month, date } =
            /^(?<year>\d{4})\D?(?<month>\d{1,2})\D?(?<date>\d{0,2})$/
            .exec(obj.Key)?.groups ?? {year: '', month: '', date: ''};
        if (!year || !month)
            return false;
        
        if (month.length === 1) {
            month = '0' + month;
        }
        if (date && date.length === 1) {
            date = '0' + date;
        } else if (!date) {
            date = '01';
        }
        const test = new Date(`${year}-${month}-${date}`);
        return test < thisMonth;
    } catch (e) {
        return false;
    }
}