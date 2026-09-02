<template>
  <div class="item">
    <span class="text">{{ label }}</span>
    <slot>
      <el-switch
        v-model="model"
        inline-prompt
        :active-icon="CheckSmall"
        :inactive-icon="CloseSmall"
        :active-value="activeValue"
        :inactive-value="inactiveValue"
      />
    </slot>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { CheckSmall, CloseSmall } from "@icon-park/vue-next";

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  modelValue: {
    type: [Boolean, String, Number],
    default: false,
  },
  activeValue: {
    type: [Boolean, String, Number],
    default: true,
  },
  inactiveValue: {
    type: [Boolean, String, Number],
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>

<style lang="scss" scoped>
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  font-size: 14px;
  margin-bottom: 10px;
  
  &:last-child {
    margin-bottom: 0;
  }

  .text {
    color: #fff;
  }

  :deep(.el-switch__core) {
    border-color: transparent;
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  :deep(.el-switch.is-checked .el-switch__core) {
    background-color: var(--el-color-primary);
  }
}
</style>
