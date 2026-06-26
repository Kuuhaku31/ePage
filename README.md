# ePages

先在 `config.env` 中设置宿主机图片目录：

```env
IMAGES_HOST_DIR=D:/def/e/comic
```

这个目录会在 Docker 容器中映射为 `/images`。

```bash
docker-compose --env-file config.env up -d
```

## 保存在 Session 中的数据

```json
{
  "currentPath": "/images/a/",
  "readIndex": 0,
}
```
