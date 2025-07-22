// TypeScript declarations for WordPress packages

declare module '@wordpress/blocks' {
  export function parse(content: string): any[];
  export function serialize(blocks: any[]): string;
}

declare module '@wordpress/block-editor' {
  export const BlockEditorProvider: React.ComponentType<any>;
  export const BlockEditorKeyboardShortcuts: React.ComponentType<any> & {
    Register: React.ComponentType<any>;
  };
  export const WritingFlow: React.ComponentType<any>;
  export const ObserveTyping: React.ComponentType<any>;
  export const BlockList: React.ComponentType<any>;
  export const BlockInspector: React.ComponentType<any>;
  export const BlockToolbar: React.ComponentType<any>;
  export const BlockSelectionClearer: React.ComponentType<any>;
  export const __unstableEditorStyles: React.ComponentType<any>;
  export const BlockBreadcrumb: React.ComponentType<any>;
}

declare module '@wordpress/components' {
  export const Popover: React.ComponentType<any> & {
    Slot: React.ComponentType<any>;
  };
  export const SlotFillProvider: React.ComponentType<any>;
  export const Button: React.ComponentType<any>;
  export const ToolbarGroup: React.ComponentType<any>;
  export const ToolbarButton: React.ComponentType<any>;
}

declare module '@wordpress/interface' {
  export const InterfaceSkeleton: React.ComponentType<any>;
  export const store: any;
}

declare module '@wordpress/data' {
  export function useSelect(selector: any, deps?: any[]): any;
  export function useDispatch(storeName: string): any;
  export function dispatch(storeName: string): any;
}

declare module '@wordpress/i18n' {
  export function __(_: string): string;
}

declare module '@wordpress/icons' {
  export const cog: any;
  export const close: any;
  export const undo: any;
  export const redo: any;
}

declare module '@wordpress/block-library' {
  export function registerCoreBlocks(): void;
}

declare module '@wordpress/element' {
  export function render(element: React.ReactElement, container: Element): void;
}

declare module '@wordpress/hooks' {
  export function addFilter(hookName: string, namespace: string, callback: Function): void;
}

declare module '@wordpress/rich-text' {
  export const RichText: React.ComponentType<any>;
}