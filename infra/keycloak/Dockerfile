FROM quay.io/keycloak/keycloak:26.0

# Realm di-import saat container pertama kali start.
COPY realm-bantuan-lapangan.json /opt/keycloak/data/import/realm-bantuan-lapangan.json

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev", "--import-realm"]
