-- เอาห้องแต่งตัวออก: คืนเงินใต้ดินให้คนที่ซื้อฉากหรือสกินไปแล้ว แล้วลบของแต่งออกจากรายการที่มี
UPDATE "User" SET "money" = "money"
  + CASE WHEN 'scene:condo' = ANY("owned") THEN 3000 ELSE 0 END
  + CASE WHEN 'skin:ex_insurance_gold' = ANY("owned") THEN 2000 ELSE 0 END
  + CASE WHEN 'skin:gamer_kid_pro' = ANY("owned") THEN 2500 ELSE 0 END
  + CASE WHEN 'skin:temple_kid_fair' = ANY("owned") THEN 3000 ELSE 0 END
  + CASE WHEN 'skin:live_seller_idol' = ANY("owned") THEN 4000 ELSE 0 END
  + CASE WHEN 'skin:phone_tech_hacker' = ANY("owned") THEN 5000 ELSE 0 END,
  "owned" = ARRAY(SELECT k FROM unnest("owned") AS k WHERE k LIKE 'char:%')
WHERE EXISTS (SELECT 1 FROM unnest("owned") AS k WHERE k NOT LIKE 'char:%');
