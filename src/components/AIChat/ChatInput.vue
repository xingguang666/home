<template>
  <div class="input-area">
    <div class="input-wrapper">
      <input
        v-model="inputValue"
        type="text"
        :placeholder="placeholder"
        :disabled="isLoading"
        @keyup.enter="handleSend"
        class="chat-input"
      />
      <button
        class="send-btn"
        :class="{ disabled: isLoading || !inputValue.trim() }"
        @click="handleSend"
        :disabled="isLoading"
      >
        <send-one theme="filled" size="20" fill="#fff" />
      </button>
    </div>
    <div class="input-hint">Enter 发送</div>
  </div>
</template>

<script setup>
import { SendOne } from "@icon-park/vue-next";
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  isLoading: { type: Boolean, default: false },
  placeholder: { type: String, default: "请输入..." },
});

const emit = defineEmits(["update:modelValue", "send"]);

const inputValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const handleSend = () => {
  if (!inputValue.value.trim() || props.isLoading) return;
  emit("send");
};
</script>

<style lang="scss" scoped>
.input-area {
  flex-shrink: 0;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);

  .input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 4px 4px 4px 18px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;

    &:focus-within {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(102, 126, 234, 0.4);
      box-shadow: 0 0 20px rgba(102, 126, 234, 0.1);
    }
  }

  .chat-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #fff;
    font-size: 0.95rem;
    padding: 12px 0;
    letter-spacing: 0.3px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .send-btn {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);

    &:hover:not(.disabled) {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    &:active:not(.disabled) {
      transform: scale(0.95);
    }

    &.disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: rgba(255, 255, 255, 0.1);
      box-shadow: none;
    }
  }

  .input-hint {
    text-align: center;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.25);
    margin-top: 6px;
  }
}
</style>
