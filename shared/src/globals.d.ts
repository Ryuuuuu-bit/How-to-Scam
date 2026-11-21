// structuredClone มีทั้งในเบราว์เซอร์และ Node 17+ แต่ shared ไม่ผูกกับ lib ฝั่งใดฝั่งหนึ่ง
declare function structuredClone<T>(value: T): T;
