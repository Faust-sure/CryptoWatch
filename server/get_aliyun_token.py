"""阿里云智能语音交互 - Token 自动获取工具（Python SDK）

用途：使用阿里云 OpenAPI（nls-meta CreateToken）动态生成 24h Token。
注意：AccessKey 必须只放在本机/服务器侧，客户端（浏览器/手表）只使用 token + appkey。

官方文档（CreateToken）：https://help.aliyun.com/document_detail/450255.html
"""

from __future__ import annotations

import argparse
import getpass
import json
import os
import sys
from typing import Any, Dict, Optional, Tuple

from aliyunsdkcore.client import AcsClient
from aliyunsdkcore.request import CommonRequest


# ==========================================
# 🔑 配置区域（建议优先用环境变量覆盖）
# ==========================================
# 请设置环境变量或在下方填入你的阿里云凭证（不要提交到 Git！）
# $env:ALIYUN_ACCESS_KEY_ID='your_access_key_id'
# $env:ALIYUN_ACCESS_KEY_SECRET='your_access_key_secret'
# $env:ALIYUN_NLS_APPKEY='your_appkey'

ACCESS_KEY_ID = ""  # 留空，从环境变量 ALIYUN_ACCESS_KEY_ID 读取
ACCESS_KEY_SECRET = ""  # 留空，从环境变量 ALIYUN_ACCESS_KEY_SECRET 读取
NLS_APPKEY = ""  # 留空，从环境变量 ALIYUN_NLS_APPKEY 读取
REGION = "cn-shanghai"  # 可被环境变量 ALIYUN_REGION 覆盖


def _mask(value: str, keep_start: int = 6, keep_end: int = 4) -> str:
    if not value:
        return ""
    if len(value) <= keep_start + keep_end:
        return value[: max(1, keep_start)] + "***"
    return value[:keep_start] + "***" + value[-keep_end:]


def _resolve_setting(env_name: str, fallback: str) -> str:
    env_value = os.getenv(env_name)
    if env_value is not None and env_value.strip() != "":
        return env_value.strip()
    return fallback


def _create_client(access_key_id: str, access_key_secret: str, region: str) -> AcsClient:
    if not access_key_id or not access_key_secret:
        raise ValueError(
            "缺少 AccessKey 凭证：请设置环境变量 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET，"
            "或在 get_aliyun_token.py 顶部填写。"
        )
    return AcsClient(access_key_id, access_key_secret, region)


def _prompt_if_missing(value: str, prompt: str, secret: bool = False) -> str:
    if value and value.strip() != "":
        return value.strip()
    if secret:
        return getpass.getpass(prompt).strip()
    return input(prompt).strip()


def create_token(access_key_id: str, access_key_secret: str, region: str) -> Tuple[str, Any, Dict[str, Any]]:
    """调用 nls-meta CreateToken，返回 (token, expire_time, raw_response_dict)。"""
    client = _create_client(access_key_id, access_key_secret, region)

    request = CommonRequest()
    request.set_method("POST")
    request.set_domain(f"nls-meta.{region}.aliyuncs.com")
    request.set_version("2019-02-28")
    request.set_action_name("CreateToken")

    response_bytes = client.do_action_with_exception(request)
    response_str = response_bytes.decode("utf-8")
    response_dict: Dict[str, Any] = json.loads(response_str)

    token_info = response_dict.get("Token")
    if not isinstance(token_info, dict) or "Id" not in token_info:
        raise RuntimeError(f"CreateToken 响应异常：{response_dict}")

    return token_info["Id"], token_info.get("ExpireTime"), response_dict


def build_config(*, verbose: bool = False, allow_prompt: bool = False) -> Dict[str, Any]:
    access_key_id = _resolve_setting("ALIYUN_ACCESS_KEY_ID", ACCESS_KEY_ID)
    access_key_secret = _resolve_setting("ALIYUN_ACCESS_KEY_SECRET", ACCESS_KEY_SECRET)
    region = _resolve_setting("ALIYUN_REGION", REGION)
    appkey = _resolve_setting("ALIYUN_NLS_APPKEY", NLS_APPKEY)

    if allow_prompt:
        if not access_key_id:
            access_key_id = _prompt_if_missing(access_key_id, "请输入 AccessKey ID: ")
        if not access_key_secret:
            access_key_secret = _prompt_if_missing(access_key_secret, "请输入 AccessKey Secret（输入不回显）: ", secret=True)
        if not appkey:
            appkey = _prompt_if_missing(appkey, "请输入 NLS AppKey（项目 AppKey）: ")

    token, expire_time, raw = create_token(access_key_id, access_key_secret, region)

    if verbose:
        print("✅ Token 获取成功")
        print(f"- region: {region}")
        print(f"- appKey: {appkey}")
        print(f"- token: {_mask(token)}")
        print(f"- expireTime: {expire_time}")
        print(f"- accessKeyId: {_mask(access_key_id)}")
        print("- raw:")
        print(json.dumps(raw, indent=2, ensure_ascii=False))

    return {
        "success": True,
        "appKey": appkey,
        "token": token,
        "tokenExpireTime": expire_time,
        "region": region,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Aliyun NLS token via CreateToken")
    parser.add_argument("--json", action="store_true", help="仅输出 JSON（便于 server.js 调用）")
    parser.add_argument("--no-write", action="store_true", help="不写入 aliyun_config.json")
    parser.add_argument("--verbose", action="store_true", help="打印更详细日志（会输出脱敏 token/AK）")
    args = parser.parse_args()

    try:
        # --json 是给服务端/脚本调用的：禁止交互提示，避免挂起。
        config = build_config(verbose=args.verbose and not args.json, allow_prompt=not args.json)

        if not args.no_write:
            with open("aliyun_config.json", "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2, ensure_ascii=False)

        if args.json:
            sys.stdout.write(json.dumps(config, ensure_ascii=False))
            return 0

        print("=" * 60)
        print("阿里云智能语音交互 - Token 自动获取（SDK版本）")
        print("=" * 60)
        print("✅ 配置已生成")
        print(f"- appKey: {config['appKey']}")
        print(f"- token: {_mask(config['token'])}")
        print(f"- tokenExpireTime: {config['tokenExpireTime']}")
        print("✅ 已写入 aliyun_config.json")
        return 0

    except Exception as e:
        error_payload = {"success": False, "error": str(e)}
        if args.json:
            sys.stdout.write(json.dumps(error_payload, ensure_ascii=False))
            return 1

        print("=" * 60)
        print("❌ Token 获取失败")
        print("=" * 60)
        print(str(e))
        print("\n排查建议：")
        print("1) 检查 AccessKey ID/Secret 是否正确")
        print("2) 确认 RAM 用户已开通并有智能语音交互（NLS）相关权限")
        print("3) 确认 Region 与项目一致（默认 cn-shanghai）")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
