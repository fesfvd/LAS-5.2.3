import logging
import smtplib
from email.mime.text import MIMEText

from backend.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

logger = logging.getLogger("las.email")


def send_code(email: str, code: str, purpose: str = "register") -> bool:
    if purpose == "reset":
        subject = "LAS 文学分析 — 密码重置验证码"
        body = f"您的密码重置验证码是：{code}\n\n10 分钟内有效。如非本人操作请忽略此邮件。\n\n—— LAS 文学分析系统"
    else:
        subject = "LAS 文学分析 — 注册验证码"
        body = f"欢迎注册 LAS 文学分析系统！\n\n您的验证码是：{code}\n\n10 分钟内有效。\n\n—— LAS 文学分析系统"

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = email

    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, [email], msg.as_string())
        logger.info("邮件发送成功 to=%s purpose=%s", email, purpose)
        return True
    except Exception as e:
        logger.error("邮件发送失败 to=%s: %s", email, e)
        return False
