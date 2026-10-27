#!/usr/bin/env python3
"""產生 COMPANY_USERS_JSON 的單一帳號設定；密碼不會回顯或寫檔。"""
import argparse, getpass, hashlib, json, secrets
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('username');p.add_argument('--quota',type=int,default=30);p.add_argument('--admin',action='store_true')
a=p.parse_args();password=getpass.getpass('帳號密碼（至少 12 字元）: ')
if len(password)<12: raise SystemExit('請使用至少 12 字元密碼')
if a.quota<0: raise SystemExit('額度不可為負數')
salt=secrets.token_hex(16)
# Node crypto.scryptSync 預設參數 N=16384, r=8, p=1。
h=hashlib.scrypt(password.encode(),salt=salt.encode(),n=16384,r=8,p=1,dklen=64).hex()
print(json.dumps({a.username:{'salt':salt,'hash':h,'quota':a.quota,'admin':a.admin}},ensure_ascii=False))
